import * as React from 'react';
import Box from '@mui/material/Box';

export default function Loading({ height = "fit-content", size = 40, color = "blue" }) {
  return (
    <Box sx={{ display: 'flex', alignItems: "center", justifyContent: "center", height: height }}>
      <div className="custom-loading" style={{ width: size, height: size, border: `3px solid ${color}` }}>
      </div>
    </Box>
  );
}
