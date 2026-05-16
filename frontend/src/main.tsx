import React from 'react'
import ReactDOM from 'react-dom/client'
import { Box, Container, CssBaseline, Typography } from '@mui/material'

function App() {
  return (
    <>
      <CssBaseline />
      <Container maxWidth="md">
        <Box sx={{ py: 10 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Novel Agent
          </Typography>
          <Typography variant="body1" color="text.secondary">
            MVP Phase 1: project initialized with Go + Echo backend and React + TypeScript + MUI frontend.
          </Typography>
        </Box>
      </Container>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
