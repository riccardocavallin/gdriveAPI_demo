const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  // authorize(JSON.parse(content), listFiles);
  // authorize(JSON.parse(content), listAllFiles);
  // authorize(JSON.parse(content), uploadFile);
  authorize(JSON.parse(content), uploadString);
  // authorize(JSON.parse(content), getFile);
  // authorize(JSON.parse(content), downloadFile);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
    // callback(oAuth2Client, '148UjgoY0y3ExE0bjsa4hpakj3g6t6nlh'); // has the id of the file to interact with
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    pageSize: 15,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
}

/**
 * Lists all the names and IDs 
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listAllFiles(auth) {
  const drive = google.drive({ version: 'v3', auth });
  getList(drive, '');
}
function getList(drive, pageToken) {
  drive.files.list({
      corpora: 'user',
      pageSize: 10,
      //q: "name='elvis233424234'",
      pageToken: pageToken ? pageToken : '',
      fields: 'nextPageToken, files(id,name)',
  }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const files = res.data.files;
      if (files.length) {
          console.log('Files:');
          processList(files);
          if (res.data.nextPageToken) {
              getList(drive, res.data.nextPageToken);
          }

          // files.map((file) => {
          //     console.log(`${file.name} (${file.id})`);
          // });
      } else {
          console.log('No files found.');
      }
  });
}
function processList(files) {
  console.log('Processing....');
  files.forEach(file => {
      // console.log(file.name + '|' + file.size + '|' + file.createdTime + '|' + file.modifiedTime);
      console.log(file);
  });
}

function uploadFile(auth) {
  const drive = google.drive({ version: 'v3', auth });
  var fileMetadata = {
      'name': 'sample.jpg'
  };
  var media = {
      mimeType: 'image/jpeg',
      body: fs.createReadStream('sample.jpg')
  };
  drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
  }, function (err, res) {
      if (err) {
          // Handle error
          console.log(err);
      } else {
          console.log('File Id: ', res.data.id);
      }
  });
}

function uploadString(auth) {
  const drive = google.drive({ version: 'v3', auth });
  // Set file metadata and data
  message = 'This is a simple String nice to meet you';
  const fileMetadata = {'name': 'uploadSimpleStringt.csv'};
  const media = {
    mimeType: 'text/csv',
    body: message
  };
  // Return the Promise result after completing its task
  return new Promise((resolve, reject) => {
    try{
      // Call Files: create endpoint
      return drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
      },(err, results) => { 
        // Result from the call
        if(err) reject(`Drive error: ${err.message}`);
        resolve(results);
      })
    } catch (error){
      console.log(`There was a problem in the promise: ${error}`);
    }
  });
}

function getFile(auth, fileId) {
  const drive = google.drive({ version: 'v3', auth });
  drive.files.get({ fileId: fileId, fields: '*' }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      console.log(res.data); 
  });
}

// function downloadFile(auth, fileId) {
//   const drive = google.drive({ version: 'v3', auth });
//   var dest = fs.createWriteStream('/tmp/photo.jpg');
//   drive.files.get({
//     fileId: fileId,
//     alt: 'media'
//   })
//     .on('end', function () {
//       console.log('Done');
//     })
//     .on('error', function (err) {
//       console.log('Error during download', err);
//     })
//     .pipe(dest);
// }

async function downloadFile(auth, fileId) {
  const drive = google.drive({ version: 'v3', auth });
  return drive.files
    .get({fileId, alt: 'media'}, {responseType: 'stream'})
    .then(res => {
      return new Promise((resolve, reject) => {
        const dest = fs.createWriteStream('/tmp/photo.jpg');
        let progress = 0;

        res.data
          .on('end', () => {
            console.log('\nDone downloading file.');
          })
          .on('error', err => {
            console.error('Error downloading file.');
            reject(err);
          })
          .on('data', d => {
            progress += d.length;
            if (process.stdout.isTTY) {
              process.stdout.clearLine();
              process.stdout.cursorTo(0);
              process.stdout.write(`Downloaded ${progress} bytes`);
            }
          })
          .pipe(dest);
      });
    });
}

