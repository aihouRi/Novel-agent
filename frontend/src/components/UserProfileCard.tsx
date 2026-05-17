import { Card, CardContent, Stack, Typography } from '@mui/material'
import type { AuthUser } from '../api/auth'

type Props = {
  user: AuthUser
}

export function UserProfileCard({ user }: Props) {
  return (
    <Card variant="outlined" sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Current User
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="body2">ID: {user.id}</Typography>
          <Typography variant="body2">Name: {user.name}</Typography>
          <Typography variant="body2">Email: {user.email}</Typography>
          <Typography variant="body2">Created: {new Date(user.created_at).toLocaleString()}</Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
