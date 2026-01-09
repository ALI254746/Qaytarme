import React, { Suspense } from "react";
import Login from "./login";

function page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login />
    </Suspense>
  );
}

export default page;
