import { Avatar, Box, Card, CardContent, IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import { MouseEvent } from 'react'
import type { MainTab, MyNovelTab } from './NovelSidebar'

type Props = {
  userName: string
  mainTab: MainTab
  myNovelTab: MyNovelTab
  menuAnchor: null | HTMLElement
  onOpenMenu: (event: MouseEvent<HTMLElement>) => void
  onCloseMenu: () => void
  onSettings: () => void
  onLogout: () => void
}

export default function NovelTopCard({ userName, mainTab, myNovelTab, menuAnchor, onOpenMenu, onCloseMenu, onSettings, onLogout }: Props) {
  return (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 3, borderColor: 'rgba(15,23,42,0.1)', bgcolor: 'rgba(255,255,255,0.9)' }}>
      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {mainTab === 'createNovel' ? '新建小说' : myNovelTab === 'novelDetail' ? '小说详情' : myNovelTab === 'novelCharacters' ? '小说角色' : '小说章节'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mainTab === 'createNovel'
              ? 'Create a new novel project'
              : myNovelTab === 'novelDetail'
                ? 'Select and edit your novel'
                : myNovelTab === 'novelCharacters'
                  ? 'Manage characters under selected novel'
                  : 'Manage chapters under selected novel'}
          </Typography>
        </Box>

        <IconButton onClick={onOpenMenu} sx={{ border: '1px solid #cbd5e1', borderRadius: 999, p: 0.5, bgcolor: 'white' }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#0f766e', fontSize: 16, fontWeight: 700 }}>
            {userName.slice(0, 1).toUpperCase()}
          </Avatar>
        </IconButton>

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={onCloseMenu}>
          <MenuItem onClick={onSettings}><ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>User Settings (Soon)</MenuItem>
          <MenuItem onClick={onLogout}><ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>Logout</MenuItem>
        </Menu>
      </CardContent>
    </Card>
  )
}
