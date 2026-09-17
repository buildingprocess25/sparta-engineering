import assert from "node:assert/strict"

import type { drive_v3 } from "googleapis"

import { createGoogleFolderGateway } from "./folder-gateway"

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder"

const listCalls: drive_v3.Params$Resource$Files$List[] = []
const getCalls: drive_v3.Params$Resource$Files$Get[] = []
const createCalls: drive_v3.Params$Resource$Files$Create[] = []

const drive = {
  files: {
    async list(params: drive_v3.Params$Resource$Files$List) {
      listCalls.push(params)

      if (!params.pageToken) {
        return {
          data: {
            nextPageToken: "page-2",
            files: [
              {
                id: "folder-1",
                name: "First",
                parents: ["root"],
                mimeType: FOLDER_MIME_TYPE,
              },
            ],
          },
        }
      }

      return {
        data: {
          files: [
            {
              id: "folder-2",
              name: "Second",
              parents: ["root"],
              mimeType: FOLDER_MIME_TYPE,
            },
          ],
        },
      }
    },

    async get(params: drive_v3.Params$Resource$Files$Get) {
      getCalls.push(params)
      return {
        data: {
          id: "folder-1",
          name: "First",
          parents: ["root"],
          mimeType: FOLDER_MIME_TYPE,
          trashed: false,
        },
      }
    },

    async create(params: drive_v3.Params$Resource$Files$Create) {
      createCalls.push(params)
      return {
        data: {
          id: "folder-3",
          name: String(params.requestBody?.name),
          parents: params.requestBody?.parents ?? [],
        },
      }
    },
  },
} as unknown as drive_v3.Drive

const gateway = createGoogleFolderGateway(drive)

assert.deepEqual(await gateway.listChildFolders("root"), [
  { id: "folder-1", name: "First", parentIds: ["root"] },
  { id: "folder-2", name: "Second", parentIds: ["root"] },
])
assert.equal(listCalls.length, 2)
assert.equal(listCalls[0].pageSize, 1000)
assert.equal(listCalls[0].supportsAllDrives, true)
assert.equal(listCalls[0].includeItemsFromAllDrives, true)
assert.equal(listCalls[0].pageToken, undefined)
assert.equal(listCalls[1].pageToken, "page-2")
assert.equal(listCalls[1].supportsAllDrives, true)
assert.equal(listCalls[1].includeItemsFromAllDrives, true)

assert.deepEqual(await gateway.getFolder("folder-1"), {
  id: "folder-1",
  name: "First",
  parentIds: ["root"],
})
assert.equal(getCalls[0].supportsAllDrives, true)

assert.deepEqual(await gateway.createFolder("root", "Created"), {
  id: "folder-3",
  name: "Created",
  parentIds: ["root"],
})
assert.deepEqual(createCalls[0].requestBody, {
  name: "Created",
  mimeType: FOLDER_MIME_TYPE,
  parents: ["root"],
})
assert.equal(createCalls[0].fields, "id,name,parents")
assert.equal(createCalls[0].supportsAllDrives, true)
