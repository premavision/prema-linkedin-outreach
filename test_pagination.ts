async function test() {
  try {
    const res = await fetch('http://localhost:4000/targets?page=1&limit=5');
    if (!res.ok) {
        console.log('Failed:', res.status, res.statusText);
        // Print body if possible
        const text = await res.text();
        console.log('Body:', text);
        return;
    }
    const data = await res.json();
    console.log('Keys:', Object.keys(data));
    if (data.items && data.total && data.stats) {
        console.log('Pagination works!');
        console.log('Total:', data.total);
        console.log('Items:', Array.isArray(data.items) ? data.items.length : 'Not array');
    } else {
        console.log('Pagination response structure invalid or old version.');
        console.log('Data:', JSON.stringify(data).substring(0, 100));
    }
  } catch (err) {
      console.log('Error:', err.message);
  }
}

test();
