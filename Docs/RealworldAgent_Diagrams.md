# RealworldAgent Diagrams

## Use Case Diagram

```mermaid
%%{init: {"theme": "neutral"}}%%
usecaseDiagram
  actor User
  actor Developer
  actor Admin

  rectangle RealworldAgent {
    usecase UC1 as "Configure Agent"
    usecase UC2 as "Run Task"
    usecase UC3 as "Review Output"
    usecase UC4 as "Manage Integrations"
  }

  User --> UC2
  User --> UC3
  Developer --> UC1
  Developer --> UC4
  Admin --> UC1
  Admin --> UC4
  Admin --> UC3
```

The activity diagram previously included in this document has been removed as it is no longer required.
