    
    let db;

    const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

// Creates a new db request for the database
const request = indexedDB.open("budget", 1);

// Creates the schema
request.onupgradeneeded = function(event) {
    // Creates the object store called "pending"
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

// Opens a transaction, checks the databasse
request.onsuccess = function(event){
    db = event.target.result;
// Checks if app is onlin 
if (navigator.onLine){
    checkDatabase();
}
};

// Logs error here if error
request.onerror = function(event){
    console.log(event.target.errorCode);
}

// Creates a transaction on the db with readwrite access
function saveRecord(record){
    const transaction = db.transaction(["pending"], "readwrite");

    const store = transaction.objectStore("pending");
    // Adds record to the store with add method
    store.add(record);
}

// This function checks the database
function checkDatabase(){
    const transaction = db.transaction(["pending"], "readwrite");
    // Access the pending object store
    const store = transaction.objectStore("pending");
    // Gets all the records from the store and sets it to a variable
    const getAll = store.getAll();

    getAll.onsuccess = function(){
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(() => {
                const transaction = db.transaction(["pending"], "readwrite");

                const store = transaction.objectStore("pending");

                store.clear();
            })
        }
    }
}

window.addEventListener("online", checkDatabase);