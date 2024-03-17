const { BlobServiceClient } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
const path = require('node:path');
const fs = require('fs').promises;
const filesystem = require('fs');
require("dotenv").config();

const filePath = path.resolve('/img', 'todo.jpg')
console.log(filePath)

// Convert stream to text
async function streamToText(readable) {
    readable.setEncoding('utf8');
    let data = '';
    for await (const chunk of readable) {
        data += chunk;
    }
    return data;
}

// containerClient: ContainerClient object
// blobName: string, includes file extension if provided
// localFilePath: fully qualified path and file name
async function uploadBlobFromLocalPath(containerClient, blobName, localFilePath) {
    // Specify data transfer options
    const uploadOptions = {
        blockSize: 4 * 1024 * 1024, // 4 MiB max block size
        concurrency: 2, // maximum number of parallel transfer workers
        maxSingleShotSize: 8 * 1024 * 1024, // 8 MiB initial transfer size
        tier: 'Hot'
    }

    // Create blob client from container client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadFile(localFilePath, uploadOptions);
}

// <Snippet_UploadBlob>
// containerClient: ContainerClient object
// blobName: string, includes file extension if provided
// buffer: blob contents as a buffer, for example, from fs.readFile()
async function uploadBlobFromBuffer(containerClient, blobName, buffer) {

    // Create blob client from container client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload buffer
    await blockBlobClient.uploadData(buffer);
}

// <Snippet_UploadBlob>
// containerClient: ContainerClient object
// blobName: string, includes file extension if provided
// readableStream: Readable stream, for example, a stream returned from fs.createReadStream()
async function uploadBlobFromReadStream(containerClient, blobName, readableStream) {
    // Create blob client from container client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload data to block blob using a readable stream
    await blockBlobClient.uploadStream(readableStream);
}

async function downloadBlobToFile(containerClient, blobName, fileNameWithPath) {

    const blobClient = containerClient.getBlobClient(blobName);

    await blobClient.downloadToFile(fileNameWithPath);
    console.log(`download of ${blobName} success`);
}

async function main() {
    try {
        console.log("Azure Blob storage v12 - JavaScript quickstart sample");

        // Quick start code goes here
        const AZURE_STORAGE_CONNECTION_STRING =
            process.env.AZURE_STORAGE_CONNECTION_STRING;

        if (!AZURE_STORAGE_CONNECTION_STRING) {
            throw Error('Azure Storage Connection string not found');
        }

        // Create the BlobServiceClient object with connection string
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            AZURE_STORAGE_CONNECTION_STRING
        );
        // Create a unique name for the container
        const containerName = 'quickstart' + uuidv1();

        console.log('\nCreating container...');
        console.log('\t', containerName);

        // Get a reference to a container
        const containerClient = blobServiceClient.getContainerClient(containerName);
        // Create the container
        const createContainerResponse = await containerClient.create();
        console.log(
            `Container was created successfully.\n\trequestId:${createContainerResponse.requestId}\n\tURL: ${containerClient.url}`
        );

        console.log('\nListing blobs...');
        console.log('\nUploading blobs...');

        let blobs = [];
        // Get fully qualified path of file
        const localFilePath = path.join('files', 'todo.jpg');


        // Get fully qualified path of file
        const textFilePath = path.join('files', 'hello.txt');

        // because no type is passed, open file as buffer
        const buffer = await fs.readFile(textFilePath);
        const readableStream = filesystem.createReadStream(textFilePath);

        await uploadBlobFromReadStream(containerClient, 'hello.txt', readableStream);


        // Create 10 blobs with Promise.all
        for (let i = 0; i < 1; i++) {
            blobs.push(uploadBlobFromLocalPath(containerClient, `todo-${i}.jpg`, localFilePath));
            blobs.push(uploadBlobFromBuffer(containerClient, `hello-${i}.txt`, buffer))
        }
        await Promise.all(blobs);

        // List the blob(s) in the container.
        for await (const blob of containerClient.listBlobsFlat()) {
            // await uploadBlobFromLocalPath(containerClient, blob.name, '/img/todo.jpg')
            console.log('uploaded')

            // Get Blob Client from name, to get the URL
            const tempBlockBlobClient = containerClient.getBlockBlobClient(blob.name);

            // Display blob name and URL
            console.log(
                `\n\tname: ${blob.name}\n\tURL: ${tempBlockBlobClient.url}\n`
            );
        }

        // Delete container
        // console.log('\nDeleting container...');

        // const deleteContainerResponse = await containerClient.delete();
        // console.log(
        //     'Container was deleted successfully. requestId: ',
        //     deleteContainerResponse.requestId
        // );

    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

// Connection string
const connString = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!connString) throw Error('Azure Storage Connection string not found');

// Client
const client = BlobServiceClient.fromConnectionString(connString);

async function createBlobFromString(containerClient, blobName, fileContentsAsString) {
}

async function downloadBlobToFile(containerClient, blobName, fileNameWithPath) {

    const blobClient = await containerClient.getBlobClient(blobName);

    await blobClient.downloadToFile(fileNameWithPath);
    console.log(`download of ${blobName} success`);
}

// async function main(blobServiceClient) {

//     // create container
//     const timestamp = Date.now();
//     const containerName = `download-blob-to-file-${timestamp}`;
//     console.log(`creating container ${containerName}`);
//     const containerOptions = {
//         access: 'container'
//     };
//     const { containerClient } = await blobServiceClient.createContainer(containerName, containerOptions);

//     console.log('container creation success');

//     // create blob
//     const blobTags = {
//         createdBy: 'YOUR-NAME',
//         createdWith: `StorageSnippetsForDocs-${timestamp}`,
//         createdOn: (new Date()).toDateString()
//     }

//     const blobName = `${containerName}-from-string.txt`;
//     const blobContent = `Hello from a string`;
//     const newFileNameAndPath = path.join(__dirname, `${containerName}-downloaded-to-file.txt`);

//     // create blob from string
//     await createBlobFromString(containerClient, blobName, blobContent, blobTags);

//     // download blob to string
//     await downloadBlobToFile(containerClient, blobName, newFileNameAndPath)

// }

main()
    .then(() => console.log("Done"))
    .catch((ex) => console.log(ex.message));