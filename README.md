# Node Timeout

A Simple Node Timeout Service for calling services back after a set time delay


```json
{
    "app_name": "nuhelp",
    "method": "get",
    "url": "http://someurl.api/api/check?somequery=yes",
    "headers": [
        {"name" : "Something-Head", "value": "Blah"}
    ],
    "body": [
        {"name" : "first_name", "value": "Hao"}
    ],
    "delay_ms": 5000
}
```