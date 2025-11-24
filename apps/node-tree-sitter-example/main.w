bring cloud;

let bucket = new cloud.Bucket();

new cloud.Function(inflight (event: Json?) => {
  let data = bucket.get("key");
  log("Data: ${data}");
});

