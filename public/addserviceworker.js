//if this browser supports service worker
if ('serviceWorker' in navigator ) {
  //add in onload event to the page
  window.addEventListener('load', () => {
    
    //load the service worker
    navigator.serviceWorker.register('service-worker.js')
    .then((reg)=>{ 
      
    //confirms the service workers load
    console.log('Service worker registered.' , reg);
    });
  });
}