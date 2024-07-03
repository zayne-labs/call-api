---
"@zayne-labs/callapi": patch
---

provided a response clone to the getResponseData function, to prevent bodyused errors when user tries to call res.whatever() in interceptor
