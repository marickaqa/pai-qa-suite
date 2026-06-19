import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios from 'axios'
import FormData from 'form-data'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'

let token: string
let chatId: string

async function getChatToken(): Promise<string> {
  const response = await axios.post(`${BASE_URL}/auth/signin`, {
    email: process.env.API_EMAIL,
    password: process.env.API_PASSWORD,
  })
  return response.data.token
}

async function createChat(): Promise<string> {
  const response = await axios.post(
    `${BASE_URL}/chat`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.data.id
}

async function uploadFile(cId: string, content = 'QA test document.', filename = 'test.txt'): Promise<string> {
  const form = new FormData()
  form.append('file', Buffer.from(content, 'utf-8'), { filename, contentType: 'text/plain' })
  const response = await axios.post(
    `${BASE_URL}/chat/${cId}/document`,
    form,
    { headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` } }
  )
  return response.data.documentId
}

beforeAll(async () => {
  token = await getChatToken()
  chatId = await createChat()
})

afterAll(async () => {
  if (chatId) {
    try {
      await axios.delete(`${BASE_URL}/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch { /* best effort */ }
  }
})

describe('Core — Chat Documents API', () => {

  describe('POST /chat/{chatId}/document', () => {

    it('should upload a text file and return document metadata', async () => {
      const form = new FormData()
      form.append('file', Buffer.from('Upload test.', 'utf-8'), {
        filename: 'upload-test.txt',
        contentType: 'text/plain',
      })
      const response = await axios.post(
        `${BASE_URL}/chat/${chatId}/document`,
        form,
        { headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` } }
      )
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('documentId')
      expect(response.data).toHaveProperty('filename')
      expect(response.data).toHaveProperty('status')
    })

    it('should return 400 when no file is provided', async () => {
      let status = 0
      try {
        await axios.post(
          `${BASE_URL}/chat/${chatId}/document`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (error: any) {
        status = error.response?.status
      }
      expect(status).toBe(400)
    })

    it('should return 401 with no token', async () => {
      let status = 0
      try {
        const form = new FormData()
        form.append('file', Buffer.from('test', 'utf-8'), { filename: 'test.txt', contentType: 'text/plain' })
        await axios.post(`${BASE_URL}/chat/${chatId}/document`, form, {
          headers: form.getHeaders(),
        })
      } catch (error: any) {
        status = error.response?.status
      }
      expect(status).toBe(401)
    })

    it('should return 400 or 404 for non-existent chatId', async () => {
      let status = 0
      try {
        const form = new FormData()
        form.append('file', Buffer.from('test', 'utf-8'), { filename: 'test.txt', contentType: 'text/plain' })
        await axios.post(
          `${BASE_URL}/chat/00000000-0000-0000-0000-000000000000/document`,
          form,
          { headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` } }
        )
      } catch (error: any) {
        status = error.response?.status
      }
      expect([400, 404]).toContain(status)
    })

  })

  describe('GET /chat/{chatId}/document', () => {

    let uploadedDocId: string

    beforeAll(async () => {
      uploadedDocId = await uploadFile(chatId, 'Document for list test.', 'list-test.txt')
    })

    it('should return documents object with documents array and count', async () => {
      const response = await axios.get(
        `${BASE_URL}/chat/${chatId}/document`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('documents')
      expect(response.data).toHaveProperty('count')
      expect(Array.isArray(response.data.documents)).toBe(true)
    })

    it('should include the uploaded document in the list', async () => {
      const response = await axios.get(
        `${BASE_URL}/chat/${chatId}/document`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const ids = response.data.documents.map((d: any) => d.id)
      expect(ids).toContain(uploadedDocId)
    })

    it('should return 401 with no token', async () => {
      let status = 0
      try {
        await axios.get(`${BASE_URL}/chat/${chatId}/document`)
      } catch (error: any) {
        status = error.response?.status
      }
      expect(status).toBe(401)
    })

  })

  describe('GET /chat/{chatId}/document/{documentId}/download', () => {

    let downloadDocId: string

    beforeAll(async () => {
      downloadDocId = await uploadFile(chatId, 'Download me.', 'download-test.txt')
    })

    it('should download the uploaded document', async () => {
      const response = await axios.get(
        `${BASE_URL}/chat/${chatId}/document/${downloadDocId}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      expect(response.status).toBe(200)
    })

    it('should return 400 or 404 for non-existent document', async () => {
      let status = 0
      try {
        await axios.get(
          `${BASE_URL}/chat/${chatId}/document/00000000-0000-0000-0000-000000000000/download`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (error: any) {
        status = error.response?.status
      }
      expect([400, 404]).toContain(status)
    })

    it('should return 401 with no token', async () => {
      let status = 0
      try {
        await axios.get(
          `${BASE_URL}/chat/${chatId}/document/${downloadDocId}/download`
        )
      } catch (error: any) {
        status = error.response?.status
      }
      expect(status).toBe(401)
    })

  })

  describe('DELETE /chat/{chatId}/document/{documentId}', () => {

    it('should delete an uploaded document', async () => {
      const docId = await uploadFile(chatId, 'Delete me.', 'delete-test.txt')
      const response = await axios.delete(
        `${BASE_URL}/chat/${chatId}/document/${docId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      expect([200, 204]).toContain(response.status)
    })

    it('should return 400 or 404 after deleting a document', async () => {
      const docId = await uploadFile(chatId, 'Delete and verify gone.', 'delete-verify.txt')
      await axios.delete(
        `${BASE_URL}/chat/${chatId}/document/${docId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      let status = 0
      try {
        await axios.get(
          `${BASE_URL}/chat/${chatId}/document/${docId}/download`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (error: any) {
        status = error.response?.status
      }
      expect([400, 404]).toContain(status)
    })

    it('should return 400 or 404 for non-existent document', async () => {
      let status = 0
      try {
        await axios.delete(
          `${BASE_URL}/chat/${chatId}/document/00000000-0000-0000-0000-000000000000`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (error: any) {
        status = error.response?.status
      }
      expect([400, 404]).toContain(status)
    })

    it('should return 401 with no token', async () => {
      let status = 0
      try {
        await axios.delete(
          `${BASE_URL}/chat/${chatId}/document/00000000-0000-0000-0000-000000000000`
        )
      } catch (error: any) {
        status = error.response?.status
      }
      expect(status).toBe(401)
    })

  })

})