import { describe, it, expect } from 'vitest'
import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'

async function getChatToken(): Promise<string> {
    const response = await axios.post(`${BASE_URL}/auth/signin`, {
        email: process.env.API_EMAIL,
        password: process.env.API_PASSWORD,
    })
    return response.data.token
}

describe('Core — Auth API', () => {

    describe('POST /auth/signin', () => {

        it('should return a token with valid credentials', async () => {
            const response = await axios.post(`${BASE_URL}/auth/signin`, {
                email: process.env.API_EMAIL,
                password: process.env.API_PASSWORD,
            })
            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty('token')
            expect(typeof response.data.token).toBe('string')
            expect(response.data.token.length).toBeGreaterThan(0)
        })

        it('should return 401 with wrong password', async () => {
            let status = 0
            try {
                await axios.post(`${BASE_URL}/auth/signin`, {
                    email: process.env.API_EMAIL,
                    password: 'WrongPassword999!',
                })
            } catch (error: any) {
                status = error.response?.status
            }
            expect(status).toBe(401)
        })

        it('should return 401 with non-existent email', async () => {
            let status = 0
            try {
                await axios.post(`${BASE_URL}/auth/signin`, {
                    email: 'nonexistent@noctocode.dev',
                    password: 'SomePassword123!',
                })
            } catch (error: any) {
                status = error.response?.status
            }
            expect(status).toBe(401)
        })

        it('should return 400 with missing email', async () => {
            let status = 0
            try {
                await axios.post(`${BASE_URL}/auth/signin`, {
                    password: process.env.API_PASSWORD,
                })
            } catch (error: any) {
                status = error.response?.status
            }
            expect([400, 422]).toContain(status)
        })

        it('should return 400 with missing password', async () => {
            let status = 0
            try {
                await axios.post(`${BASE_URL}/auth/signin`, {
                    email: process.env.API_EMAIL,
                })
            } catch (error: any) {
                status = error.response?.status
            }
            expect([400, 422]).toContain(status)
        })

    })

    describe('GET /auth/get', () => {

        it('should return user profile with valid token', async () => {
            const token = await getChatToken()
            const response = await axios.get(`${BASE_URL}/auth/get`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty('user')
            expect(response.data.user).toHaveProperty('id')
            expect(response.data.user).toHaveProperty('email')
            expect(response.data.user.email).toBe(process.env.API_EMAIL)
        })

        it('should return 401 with no token', async () => {
            let status = 0
            try {
                await axios.get(`${BASE_URL}/auth/get`)
            } catch (error: any) {
                status = error.response?.status
            }
            expect(status).toBe(401)
        })

        it('should return 401 with invalid token', async () => {
            let status = 0
            try {
                await axios.get(`${BASE_URL}/auth/get`, {
                    headers: { Authorization: 'Bearer invalidtoken123' },
                })
            } catch (error: any) {
                status = error.response?.status
            }
            expect(status).toBe(401)
        })

    })

    describe('POST /auth/signout', () => {

        it('should return 200 when signing out with valid token', async () => {
            const token = await getChatToken()
            const response = await axios.post(
                `${BASE_URL}/auth/signout`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            )
            expect([200, 204]).toContain(response.status)
        })

        it('should invalidate the token after signout', async () => {
            const token = await getChatToken()
            await axios.post(
                `${BASE_URL}/auth/signout`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            )
            let status = 0
            try {
                await axios.get(`${BASE_URL}/auth/get`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            } catch (error: any) {
                status = error.response?.status
            }
            expect(status).toBe(401)
        })

    })

    describe('POST /auth/signup', () => {

        it('should create a new account with valid data', async () => {
            const email = `qa-test-${Date.now()}@noctocode.dev`
            const response = await axios.post(`${BASE_URL}/auth/signup`, {
                email,
                password: 'TestPassword123!',
            })
            expect([200, 201]).toContain(response.status)
        })

        it('should return generic response for already registered email (no enumeration)', async () => {
            // BUG-024 fixed — API now returns the same generic response regardless of whether email is registered
            const response = await axios.post(`${BASE_URL}/auth/signup`, {
                email: process.env.API_EMAIL,
                password: 'TestPassword123!',
            })
            expect(response.status).toBe(200)
        })

        it('should return 400 for invalid email format', async () => {
            let status = 0
            try {
                await axios.post(`${BASE_URL}/auth/signup`, {
                    email: 'notanemail',
                    password: 'TestPassword123!',
                })
            } catch (error: any) {
                status = error.response?.status
            }
            expect([400, 422]).toContain(status)
        })

        it('should return 400 with missing fields', async () => {
            let status = 0
            try {
                await axios.post(`${BASE_URL}/auth/signup`, {})
            } catch (error: any) {
                status = error.response?.status
            }
            expect([400, 422]).toContain(status)
        })

    })
    describe('POST /auth/forgot-password', () => {

        it('should return 200 for a valid registered email', async () => {
            const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
                email: process.env.API_EMAIL,
            })
            expect(response.status).toBe(200)
        })

        it('should return 200 for a non-existent email (no enumeration)', async () => {
            // BUG-020 fixed — API now returns 200 regardless of whether email is registered
            const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
                email: 'doesnotexist@noctocode.dev',
            })
            expect(response.status).toBe(200)
        })

        it('should return 400 for missing email', async () => {
            let status = 0
            try {
                await axios.post(`${BASE_URL}/auth/forgot-password`, {})
            } catch (error: any) {
                status = error.response?.status
            }
            expect([400, 422]).toContain(status)
        })

    })

})
