# ActivityPub Domain

## Architecture

### Service

Provides functionality for the application layer. Common operations include:
    - Retrieving data from the repository layer and constructing entities

### Entity

Represents a real-world object or concept. The service layer is responsible for
the creation of entities. Entities currently define how they are serialized to a 
DTO in lieu of a data-mapper layer.

### Repository

Provides functionality for interacting with a database. Typically used by the
service layer. DTOs are used to pass data between the repository and the service
layer. 

### DTO

Used to pass data between the repository and the service layer.

## Database

<img src="./database.png" alt="DB Schema" />

- `sites` - Information about each site that utilises the service
- `actors` - ActivityPub actors associated with objects and activities
- `objects` - ActivityPub objects associated with activities
- `activities` - ActivityPub activities
  - Pivot table that references `actors` and `objects`
- `inbox` - Received activities for an actor
  - Pivot table that references `actors` and `activities`
-  ...

## Conventions

- If an entity references another entity, when it is created, the referenced entity 
should also be created. This reference is normally indicated via a `<entity>_id` field
in the entity's DTO.

## Notes, Thoughts, Questions

### How does data get scoped?

When a request is received, the hostname is extracted from the request and used to 
determine the site that the request is scoped to. The only data that requires scoping
is actor data within the context of a site (i.e the same actor can be present on
multiple sites). Site specific actor data includes:
- Inbox

### Why is actvities a pivot table?

ActivityPub activities largely follow the same structure:

```json
{
    "id": "...",
    "type": "...",
    "actor": {},
    "object": {},
    "@context": [
        "https://www.w3.org/ns/activitystreams",
        "https://w3id.org/security/data-integrity/v1"
    ]
}
```

Rather than storing repated actor and object data, we can store a single actor and 
object entity and reference them in the activity. This reduces the amount of data 
that needs to be stored and allows for easier querying and indexing. This also makes
it easier to keep actor data up-to-date, as we only need to update the data in one
place as well as allowing multiple activities to reference the same actor or object
without having to duplicate the data.
