import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Container, Stack, TextField, Typography } from '@mui/material'
import { login, me, register, type AuthUser } from '../api/auth'
import NovelsPage from './NovelsPage'

type Mode = 'login' | 'register'
const TOKEN_KEY = 'novel_agent_token'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY)
    if (!saved) return

    setToken(saved)
    void fetchMe(saved)
  }, [])

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim()) return false
    if (mode === 'register' && !name.trim()) return false
    return true
  }, [email, password, name, mode])

  async function fetchMe(nextToken: string) {
    try {
      const data = await me(nextToken)
      setUser(data.user)
    } catch (e) {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setUser(null)
      setError(e instanceof Error ? e.message : 'Failed to fetch current user')
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const data =
        mode === 'register'
          ? await register({ name: name.trim(), email: email.trim(), password })
          : await login({ email: email.trim(), password })

      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      setUser(data.user)
      setMessage(mode === 'register' ? 'Register success.' : 'Login success.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setMessage('Logged out.')
  }

  function toggleMode() {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
    setError('')
    setMessage('')
  }

  if (token && user) {
    return <NovelsPage token={token} user={user} onLogout={handleLogout} />
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 6, md: 10 },
        background:
          'radial-gradient(circle at top, rgba(36, 99, 235, 0.1), rgba(15, 23, 42, 0) 45%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            Novel Agent
          </Typography>
        </Box>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'rgba(15, 23, 42, 0.08)',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
            bgcolor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              {mode === 'login' ? 'Login' : 'Create Account'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {mode === 'login' ? 'Welcome back.' : 'Create your account to continue.'}
            </Typography>

            <Stack spacing={2}>
              {mode === 'register' && (
                <TextField
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  autoComplete="name"
                />
              )}
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                autoComplete="email"
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                sx={{ mt: 1, py: 1.25, fontWeight: 600, textTransform: 'none' }}
              >
                {loading ? 'Submitting...' : mode === 'register' ? 'Create Account' : 'Login'}
              </Button>
            </Stack>

            <Box sx={{ mt: 2.5, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" component="span">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              </Typography>
              <Button variant="text" onClick={toggleMode} sx={{ textTransform: 'none', minWidth: 0, px: 0.5 }}>
                {mode === 'login' ? 'Register' : 'Login'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}
      </Container>
    </Box>
  )
}
