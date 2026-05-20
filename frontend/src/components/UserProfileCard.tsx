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
          当前用户
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="body2">ID: {user.id}</Typography>
          <Typography variant="body2">昵称: {user.name}</Typography>
          <Typography variant="body2">邮箱: {user.email}</Typography>
          <Typography variant="body2">创建时间: {new Date(user.created_at).toLocaleString()}</Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
