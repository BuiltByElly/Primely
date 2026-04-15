# Backend – Primely

This directory contains the **Python backend** for the Primely project.  
This project uses FastAPI.  
Below are general instructions for setting up and running the backend.

---

## Project Structure

```
Backend/
  alembic/              #Alembic files
  app/
     main.py            # Main application entry point (example)
     api/               # contains endpoints and their dependencies
     core/              # contains database initialization, logging, config and middleware
     models/            # contains tables for the database
     schemas/           # contains pydantic data models for internal data types
     service/           # contains the business logic
     tests/             # contains test logic for important endpoints
     utils/             # contains utility helpers used through out the app
```

---

## Setup Instructions

### 1. Create and Activate a Virtual Environment

```sh
python -m venv venv

```

### 2. Install Dependencies

```sh
pip install -r requirements.txt
```

### 3. Run the Backend

```sh
fastapi dev
```
or

```sh
python -m fastapi dev
```
or

```sh
python -m uvicorn app.main:app --reload
```


---

## Development Notes

- Update `requirements.txt` when you add new dependencies:  
  `pip freeze > requirements.txt`
- Use environment variables for secrets/configuration.  
- Add tests and documentation as your project grows.

---

## License

See [../LICENSE](../LICENSE).
