# Test Execution Instructions

This project runs **API** and **E2E (Playwright)** tests **only inside Docker**.

## Running API tests

Run all API tests:
```bash
npm run api:docker
```

Run smoke API tests only:
```bash
npm run api:docker:smoke
```

## Running E2E (Playwright) tests

Run all E2E tests:
```bash
npm run e2e:docker
```

Run smoke E2E tests only:
```bash
npm run e2e:docker:smoke
```