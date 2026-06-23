(async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjoxOSwicm9sIjoicGFjaWVudGUiLCJpYXQiOjE3ODIxMDE1MTEsImV4cCI6MTc4MjE4NzkxMX0.kHpquROMzisa9Lm28uLYliWe-MCvMG7CBDPmwvH2sH4';
  try {
    const res = await fetch('http://localhost:3000/api/citas/paciente/me', {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    console.log('status', res.status);
    const text = await res.text();
    console.log(text);
  } catch (e) {
    console.error(e);
  }
})();
