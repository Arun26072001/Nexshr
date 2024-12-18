import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';  // For vertical dots
import { ToastContainer } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles
import '../../App.css'; // Assuming you have a CSS file for custom styles

export default function AnnouncementTable({ announcements, handleDelete }) {
  const [anchorEl, setAnchorEl] = useState(null);  // For managing the menu anchor element
  const [currentAnnouncementId, setCurrentAnnouncementId] = useState(null); // Track current announcement for deletion
  const [searchTermcategory, setsearchTermcategory] = useState("");

  const filteredListscategory = announcements?.filter((item) =>
    item?.title?.toLowerCase().includes(searchTermcategory?.toLowerCase())
  );

  // Open menu
  const handleMenuOpen = (event, announcementId) => {
    setAnchorEl(event.currentTarget);
    setCurrentAnnouncementId(announcementId);  // Set the current announcement ID for deletion
  };

  // Close menu
  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentAnnouncementId(null); // Reset the currentAnnouncementId when menu is closed
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Search bar container */}
      <div className="searchInputIcon">
        <input
          type="text"
          placeholder="Search"
          value={searchTermcategory}
          onChange={(e) => setsearchTermcategory(e.target.value)}
        />
      </div>

      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell> {/* Add Actions column */}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredListscategory?.map((announcement) => (
              <TableRow hover key={announcement.announcementId}>
                <TableCell>{announcement.title}</TableCell>
                <TableCell>{new Date(announcement.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(announcement.endDate).toLocaleDateString()}</TableCell>
                <TableCell>{announcement.message}</TableCell>
                <TableCell>
                  {/* Vertical dots (More options) with small size */}
                  <IconButton
                    onClick={(event) => handleMenuOpen(event, announcement.announcementId)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                  {/* Show Menu only for the clicked row */}
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl) && currentAnnouncementId === announcement.announcementId}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={() =>
                      handleDelete(
                        announcement?.announcementId
                      )
                    }>Delete</MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ToastContainer />
    </Paper>
  );
}

