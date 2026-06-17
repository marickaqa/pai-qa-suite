import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getSaasToken, authHeaders } from '../../../../utils/saasClient'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import FormData from 'form-data'

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const TEST_BOT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'

let token: string
let createdFolderId: string
let createdDocumentId: string

beforeAll(async () => {
  token = await getSaasToken()
})

afterAll(async () => {
  if (createdFolderId) {
    try {
      await axios.delete(
        `${BASE_URL}/chatbot/${TEST_BOT_ID}/folder/${createdFolderId}`,
        { headers: authHeaders(token) }
      )
    } catch { /* best effort */ }
  }
  if (createdDocumentId) {
    try {
      await axios.delete(
        `${BASE_URL}/chatbot/${TEST_BOT_ID}/document/${createdDocumentId}`,
        { headers: authHeaders(token) }
      )
    } catch { /* best effort */ }
  }
})

describe('Core — Knowledge Management API', () => {

  it('should list documents for a chatbot', async () => {
    const response = await axios.get(
      `${BASE_URL}/chatbot/${TEST_BOT_ID}/document`,
      { headers: authHeaders(token) }
    )
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('documents')
    expect(Array.isArray(response.data.documents)).toBe(true)
    expect(response.data).toHaveProperty('count')
  })

  it('should list folders for a chatbot', async () => {
    const response = await axios.get(
      `${BASE_URL}/chatbot/${TEST_BOT_ID}/folder`,
      { headers: authHeaders(token) }
    )
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('folders')
    expect(Array.isArray(response.data.folders)).toBe(true)
  })

  it('should create a new folder', async () => {
    const response = await axios.post(
      `${BASE_URL}/chatbot/${TEST_BOT_ID}/folder`,
      { name: 'qa-test-folder-' + Date.now() },
      { headers: authHeaders(token) }
    )
    expect(response.status).toBe(201)
    expect(response.data).toHaveProperty('id')
    expect(response.data.chatbotId).toBe(TEST_BOT_ID)
    createdFolderId = response.data.id
  })

  it('should rename a folder', async () => {
    expect(createdFolderId).toBeTruthy()
    const newName = 'qa-test-folder-renamed-' + Date.now()
    const response = await axios.patch(
      `${BASE_URL}/chatbot/${TEST_BOT_ID}/folder/${createdFolderId}`,
      { name: newName },
      { headers: authHeaders(token) }
    )
    expect(response.status).toBe(200)

    const folders = await axios.get(
      `${BASE_URL}/chatbot/${TEST_BOT_ID}/folder`,
      { headers: authHeaders(token) }
    )
    const renamed = folders.data.folders.find((f: any) => f.id === createdFolderId)
    expect(renamed?.name).toBe(newName)
  })

  it('should upload a document', async () => {
    const filePath = path.join('reports', 'qa-test-doc.txt')
    fs.writeFileSync(filePath, 'This is a QA test document for automated testing.')

    const form = new FormData()
    form.append('file', fs.createReadStream(filePath), 'qa-test-doc.txt')

    const response = await axios.post(
      `${BASE_URL}/chatbot/${TEST_BOT_ID}/document`,
      form,
      { headers: { ...authHeaders(token), ...form.getHeaders() } }
    )
    expect(response.status).toBe(201)
    expect(response.data).toHaveProperty('documentId')
    createdDocumentId = response.data.documentId
  })

  it('should list web crawl jobs', async () => {
    const response = await axios.get(
      `${BASE_URL}/chatbot/${TEST_BOT_ID}/web/crawl`,
      { headers: authHeaders(token) }
    )
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('requests')
    expect(Array.isArray(response.data.requests)).toBe(true)
  })

  it('should delete the test folder', async () => {
    expect(createdFolderId).toBeTruthy()
    try {
      await axios.delete(
        `${BASE_URL}/chatbot/${TEST_BOT_ID}/folder/${createdFolderId}`,
        { headers: authHeaders(token) }
      )
    } catch { /* best effort */ }

    const folders = await axios.get(
      `${BASE_URL}/chatbot/${TEST_BOT_ID}/folder`,
      { headers: authHeaders(token) }
    )
    const stillExists = folders.data.folders?.some((f: any) => f.id === createdFolderId)
    expect(stillExists).toBe(false)
    createdFolderId = ''
  })

})
