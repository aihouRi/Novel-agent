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
            {mainTab === 'createNovel'
              ? '新建小说'
              : myNovelTab === 'novelDetail'
                ? '小说详情'
                : myNovelTab === 'novelCharacters'
                  ? '小说角色'
                  : myNovelTab === 'novelLoreEntries'
                    ? '小说设定'
                    : '小说章节'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mainTab === 'createNovel'
              ? '创建新的小说项目'
              : myNovelTab === 'novelDetail'
                ? '查看并编辑当前小说'
                : myNovelTab === 'novelCharacters'
                  ? '管理当前小说的角色'
                  : myNovelTab === 'novelLoreEntries'
                    ? '管理当前小说的设定卡'
                    : '管理当前小说的章节'}
          </Typography>
        </Box>

        <IconButton onClick={onOpenMenu} sx={{ border: '1px solid #cbd5e1', borderRadius: 999, p: 0.5, bgcolor: 'white' }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#0f766e', fontSize: 16, fontWeight: 700 }}>
            {userName.slice(0, 1).toUpperCase()}
          </Avatar>
        </IconButton>

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={onCloseMenu}>
          <MenuItem onClick={onSettings}><ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>用户设置（后续开放）</MenuItem>
          <MenuItem onClick={onLogout}><ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>退出登录</MenuItem>
        </Menu>
      </CardContent>
    </Card>
  )
}
