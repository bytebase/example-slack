a new SQL Editor User request in Bytebase is made, the webhook msg is like this:

```json
[
   {
      "type":"section",
      "text":{
         "type":"mrkdwn",
         "text":"*Issue approval needed*"
      }
   },
   {
      "type":"section",
      "text":{
         "type":"mrkdwn",
         "text":"*Project Title:* Sample Project"
      }
   },
   {
      "type":"section",
      "text":{
         "type":"mrkdwn",
         "text":"*Project ID:* projects/project-sample"
      }
   },
   {
      "type":"section",
      "text":{
         "type":"mrkdwn",
         "text":"*Issue:* [instances/prod-sample-instance/databases/hr_prod] Request querier role @12-09 16:14 UTC+0800"
      }
   },
   {
      "type":"section",
      "text":{
         "type":"mrkdwn",
         "text":"*Issue Creator:* dev (dev@example.com)"
      }
   },
   {
      "type":"section",
      "text":{
         "type":"mrkdwn",
         "text":"*Issue Description:* "
      }
   },
   {
      "type":"section",
      "text":{
         "type":"mrkdwn",
         "text":"Actor: Bytebase (support@bytebase.com)"
      }
   },
   {
      "type":"actions",
      "elements":[
         {
            "type":"button",
            "text":{
               "type":"plain_text",
               "text":"View in Bytebase"
            },
            "url":"https://jg4k3wkb-8080.asse.devtunnels.ms/projects/project-sample/issues/instances-prod-sample-instance-databases-hr_prod-request-querier-role-at12-09-16-14-utc-0800-112"
         }
      ]
   }
]
```

