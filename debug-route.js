// Quick debug script to test route
console.log('Testing route /school-access');

fetch('/school-access')
  .then(response => {
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    return response.text();
  })
  .then(html => {
    console.log('Response contains "الوصول إلى مدرستك":', html.includes('الوصول إلى مدرستك'));
    console.log('Response contains "404":', html.includes('404'));
    console.log('Response contains "Page Not Found":', html.includes('Page Not Found'));
  })
  .catch(err => console.error('Error:', err));