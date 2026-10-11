// Sends a form to Netlify Forms. Each form name used here must also exist as a
// hidden <form> in index.html, which is how Netlify discovers it at deploy time.
// Submissions show up in the Netlify dashboard under Forms.
export async function submitForm(formName, fields) {
  const body = new URLSearchParams({ "form-name": formName, ...fields });
  const res = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Form "${formName}" failed (${res.status})`);
}
