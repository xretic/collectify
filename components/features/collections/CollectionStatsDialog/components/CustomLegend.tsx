import { Stack } from '@mui/material';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

export function CustomLegend({ payload }: any) {
    return (
        <Stack
            direction="row"
            spacing={2}
            sx={{
                fontSize: 12,
                position: 'absolute',
                top: 0,
                right: 0,
                alignItems: 'center',
                pointerEvents: 'none',
            }}
        >
            {payload?.map((entry: any) => {
                let Icon;
                if (entry.value === 'Comments') Icon = ForumOutlinedIcon;
                if (entry.value === 'Likes') Icon = FavoriteBorderIcon;
                if (entry.value === 'Favorites') Icon = BookmarkBorderIcon;

                return (
                    <Stack key={entry.value} direction="row" spacing={0.5} alignItems="center">
                        {Icon && <Icon sx={{ fontSize: 14, color: entry.color }} />}
                        <span>{entry.value}</span>
                    </Stack>
                );
            })}
        </Stack>
    );
}
