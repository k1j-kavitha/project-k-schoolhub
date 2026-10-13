# Backend Architecture and Request Flow

This guide describes the backend as it is implemented today. The examples use the Student REST API and the active Spring Boot application in this `backend` directory.

## The Big Picture

The layers divide one request into smaller jobs. For example, when Postman sends a request to create a student, the work moves through these parts:

```text
Postman / client
    -> Spring MVC routes the HTTP request
    -> StudentController receives and validates the request DTO
    -> StudentService defines the operation; StudentServiceImpl performs it
    -> StudentMapper converts the DTO into a Student entity
    -> StudentRepository uses Spring Data JPA to save the entity
    -> PostgreSQL stores the row
    <- mapper converts the saved entity into a response DTO
    <- controller returns the HTTP response
```

For a `GET` request, the direction is similar, but the repository first loads an entity from the database and the mapper turns it into a response DTO. The client normally receives JSON; it does not receive a Java entity.

## Example: Create a Student

In Postman, send `POST /api/students` with a JSON body such as:

```json
{
  "name": "Asha Kumar",
  "age": 15,
  "course": "Science",
  "contactNumber": "5551234567"
}
```

Here is what happens:

1. Spring MVC matches `POST /api/students` to `StudentController.createStudent`.
2. Spring reads the JSON body and creates a `StudentRequest` record. `@Valid` asks Bean Validation to check its constraints. For example, `name` cannot be blank and cannot exceed 100 characters.
3. The controller passes the request DTO to `StudentService`. The controller handles HTTP concerns; it does not build SQL or decide how the entity is stored.
4. `StudentServiceImpl` asks `StudentMapper` to make a `Student` entity, then calls `StudentRepository.save`.
5. Spring Data JPA and Hibernate persist the entity. PostgreSQL assigns its generated `student_id`.
6. The mapper converts the saved entity into `StudentResponse`, including the assigned ID.
7. The controller returns the response with HTTP `201 Created` and a `Location` header pointing to `/api/students/{studentId}`.

The related implementation is in [StudentController](src/main/java/com/example/project_k_schoolhub/controller/StudentController.java), [StudentRequest](src/main/java/com/example/project_k_schoolhub/dto/StudentRequest.java), [StudentServiceImpl](src/main/java/com/example/project_k_schoolhub/service/StudentServiceImpl.java), [StudentMapper](src/main/java/com/example/project_k_schoolhub/mapper/StudentMapper.java), and [StudentRepository](src/main/java/com/example/project_k_schoolhub/repository/StudentRepository.java).

## What Each Standard Does

These are common Spring application patterns. Spring provides features that support them, but Spring does not require every project to use exactly this folder structure.

| Part                                 | What it means here                                                                                                                                                 | Importance and impact                                                                                                                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REST controller                      | `StudentController` uses `@RestController`, `@RequestMapping`, and HTTP mapping annotations.                                                                       | Connects HTTP methods and URLs to Java methods. Keeping it focused on request/response work makes the API easier to follow and change.                                                                                                                                     |
| Request DTO                          | `StudentRequest` is the data shape accepted from a client. It is a Java record with validation annotations.                                                        | Controls which input fields the API accepts and validates them before service work begins. It keeps database details out of the public request contract.                                                                                                                   |
| Response DTO                         | `StudentResponse` is the data shape returned to the client.                                                                                                        | Gives the API control over what it exposes. The API can change without automatically exposing every field added to the database entity.                                                                                                                                    |
| Service interface and implementation | `StudentService` describes available student operations; `StudentServiceImpl` performs them and has `@Service`.                                                    | Keeps business/use-case work out of the controller. The interface gives the controller a clear dependency and can make alternate implementations or isolated tests easier later. The current rules are simple: create, read, update, delete, and report a missing student. |
| Mapper                               | `StudentMapper` converts request DTOs to entities and entities to response DTOs.                                                                                   | Centralizes field copying so controllers and services do not need to know the details of both API and database shapes. This project uses a handwritten mapper, not a code-generation library.                                                                              |
| Entity                               | `Student` has `@Entity` and `@Table`; its fields map to columns in the student table.                                                                              | Gives JPA a Java representation of a database row. The generated ID and column annotations describe persistence mapping; this class is not the API request/response format.                                                                                                |
| Repository                           | `StudentRepository` extends `JpaRepository<Student, Long>`.                                                                                                        | Provides common database operations such as `save`, `findAll`, `findById`, and `delete` without this project writing those SQL statements itself.                                                                                                                          |
| Validation                           | Jakarta Bean Validation annotations on `StudentRequest`, activated by `@Valid` in the controller.                                                                  | Rejects invalid input at the API boundary. Currently, name is required and limited to 100 characters; course is limited to 100 and contact number to 15. Age has no validation constraint yet.                                                                             |
| Exception handling                   | `GlobalExceptionHandler` uses `@RestControllerAdvice` for missing records and validation errors.                                                                   | Keeps error responses consistent instead of putting repeated error-building code in every endpoint. Missing students become `404 Not Found`; invalid request fields become `400 Bad Request` with an `errors` property.                                                    |
| Transactions                         | `StudentServiceImpl` has `@Transactional`; read operations additionally use `@Transactional(readOnly = true)`.                                                     | Groups service database work within a transaction. Read-only transactions communicate that the list and lookup operations are not intended to modify data.                                                                                                                 |
| Database migrations                  | Flyway runs `V1__create_student_table.sql`; JPA is configured with `ddl-auto=validate`.                                                                            | Keeps schema changes in versioned SQL files. Hibernate checks that entity mappings fit the schema rather than silently creating or changing tables at startup.                                                                                                             |
| Dependency injection                 | The controller and service receive dependencies through constructors. `@RestController`, `@Service`, and `@Component` let Spring create and connect those objects. | Avoids classes constructing their own dependencies, making the application more modular and easier to test or replace in the future.                                                                                                                                       |

The entity is in [Student](src/main/java/com/example/project_k_schoolhub/entity/Student.java), error handling is in [GlobalExceptionHandler](src/main/java/com/example/project_k_schoolhub/exception/GlobalExceptionHandler.java), and the initial schema is in [V1\_\_create_student_table.sql](src/main/resources/db/migration/V1__create_student_table.sql). Database settings, including `ddl-auto=validate`, are in [application.properties](src/main/resources/application.properties).

## Available Student Endpoints

| Method   | URL                         | Purpose                             | Successful response                                        |
| -------- | --------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| `POST`   | `/api/students`             | Create a student                    | `201 Created`, response body, and `Location` header        |
| `GET`    | `/api/students`             | List students                       | `200 OK` with a JSON array                                 |
| `GET`    | `/api/students/{studentId}` | Get one student                     | `200 OK`; `404 Not Found` if the ID does not exist         |
| `PUT`    | `/api/students/{studentId}` | Replace the editable student fields | `200 OK`; `404 Not Found` if the ID does not exist         |
| `DELETE` | `/api/students/{studentId}` | Delete a student                    | `204 No Content`; `404 Not Found` if the ID does not exist |

Both create and update use `StudentRequest`. The ID is selected in the URL for update and generated by the database for create; it is not accepted as a request-body field.

## Spring Boot Features and Current Scope

The Maven project uses Java 21 and Spring Boot 4.1.1. Its dependencies include Spring MVC for HTTP APIs, Spring Data JPA for persistence, Jakarta Validation for input checks, Flyway for database migrations, and the PostgreSQL driver. The patterns above describe features the current code actually uses.

Some useful capabilities are not implemented in this Student API yet: authentication/authorization, pagination, custom age validation, and dedicated controller/service tests. The current test verifies that the Spring application context loads; it does not exercise the CRUD endpoints. Actuator is included as a dependency, but it is separate from the student request flow.
