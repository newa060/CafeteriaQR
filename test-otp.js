const fs = require('fs');
const fetch = globalThis.fetch;
fetch('https://oovhcidhlyavhojkfltb.supabase.co/auth/v1/otp', { 
  method: 'POST', 
  headers: { 
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdmhjaWRobHlhdmhvamtmbHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjY3OTMsImV4cCI6MjA5MDgwMjc5M30.54wDeSsQJG0RodUquZa74m0WnzZNcjyCVBsJz_9MQyM', 
    'Content-Type': 'application/json' 
  }, 
  body: JSON.stringify({ email: 'pandeybishal430@gmail.com', create_user: true }) 
}).then(r => r.text().then(t => {
  fs.writeFileSync('supabase_error_result.json', JSON.stringify({ status: r.status, body: JSON.parse(t) }, null, 2));
  console.log('Wrote to file.');
}))
