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
      setError(e instanceof Error ? e.message : '获取当前用户失败')
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
      setMessage(mode === 'register' ? '注册成功。' : '登录成功。')
    } catch (e) {
      setError(e instanceof Error ? e.message : '请求失败')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setMessage('已退出登录。')
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
              {mode === 'login' ? '登录' : '创建账号'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {mode === 'login' ? '欢迎回来。' : '创建账号后继续使用。'}
            </Typography>

            <Stack spacing={2}>
              {mode === 'register' && (
                <TextField
                  label="昵称"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  autoComplete="name"
                />
              )}
              <TextField
                label="邮箱"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                autoComplete="email"
              />
              <TextField
                label="密码"
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
                {loading ? '提交中...' : mode === 'register' ? '创建账号' : '登录'}
              </Button>
            </Stack>

            <Box sx={{ mt: 2.5, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" component="span">
                {mode === 'login' ? '还没有账号？' : '已有账号？'}
              </Typography>
              <Button variant="text" onClick={toggleMode} sx={{ textTransform: 'none', minWidth: 0, px: 0.5 }}>
                {mode === 'login' ? '去注册' : '去登录'}
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
