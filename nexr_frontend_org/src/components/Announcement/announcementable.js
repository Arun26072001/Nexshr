import * as React from 'react';
// import "../Attendence/Attendence.css";
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TextField from '@mui/material/TextField';

// Columns definition
const columns = [
  { id: 'title', label: 'Title', minWidth: 120, align: 'center' },
  { id: 'department', label: 'Department', minWidth: 120, align: 'center' },
  { id: 'start_date', label: 'Start date', minWidth: 120, align: 'center' },
  { id: 'end_date', label: 'End date', minWidth: 120, align: 'center' },
  { id: 'description', label: 'Description', minWidth: 120, align: 'center' },
  { id: 'created_by', label: 'Created by', minWidth: 120, align: 'center' },
  {
    id: 'action',
    label: 'Action',
    minWidth: 170,
    align: 'center',
    format: (value, rowIndex, handleMenuOpen) => (
      <div className="editdropdown">
        <IconButton onClick={(event) => handleMenuOpen(event, rowIndex)}>
          <MoreVertIcon />
        </IconButton>
      </div>
    ),
  },
];

// Sample data
function createData(title, department, start_date, end_date, description, created_by) {
  return { title, department, start_date, end_date, description, created_by };
}

const initialRows = [
  createData('Holiday Announcement', 'HR', '2024-12-24', '2024-12-25', 'Christmas holiday announcement', 'Admin'),
  createData('Year End Party', 'Marketing', '2024-12-30', '2024-12-30', 'End of year party', 'HR'),
];

export default function StickyHeadTable() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [rows, setRows] = React.useState(initialRows);
  const [editableRowIndex, setEditableRowIndex] = React.useState(null);
  const [editedRowData, setEditedRowData] = React.useState(null);
  const [openModal, setOpenModal] = React.useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = React.useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleMenuOpen = (event, rowIndex) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowIndex(rowIndex);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setEditableRowIndex(selectedRowIndex);
    setEditedRowData({ ...rows[selectedRowIndex] });
    handleMenuClose();
    setOpenModal(true);
  };

  const handleDelete = () => {
    const updatedRows = rows.filter((row, index) => index !== selectedRowIndex);
    setRows(updatedRows);
    handleMenuClose();
  };

  const handleSave = () => {
    const updatedRows = [...rows];
    updatedRows[editableRowIndex] = editedRowData;
    setRows(updatedRows);
    setEditableRowIndex(null);
    setEditedRowData(null);
    setOpenModal(false);
  };

  const handleInputChange = (field, value) => {
    setEditedRowData((prevData) => ({ ...prevData, [field]: value }));
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id} align={column.align} style={{ minWidth: column.minWidth }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, rowIndex) => {
              return (
                <TableRow hover role="checkbox" tabIndex={-1} key={rowIndex}>
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {column.format
                          ? column.format(value, rowIndex, handleMenuOpen)
                          : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Edit Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>Edit Announcement</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            value={editedRowData?.title || ""}
            onChange={(e) => handleInputChange("title", e.target.value)}
            margin="normal"
          />
          <TextField
            label="Department"
            fullWidth
            value={editedRowData?.department || ""}
            onChange={(e) => handleInputChange("department", e.target.value)}
            margin="normal"
          />
          <TextField
            label="Start Date"
            fullWidth
            type="date"
            value={editedRowData?.start_date || ""}
            onChange={(e) => handleInputChange("start_date", e.target.value)}
            margin="normal"
          />
          <TextField
            label="End Date"
            fullWidth
            type="date"
            value={editedRowData?.end_date || ""}
            onChange={(e) => handleInputChange("end_date", e.target.value)}
            margin="normal"
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            value={editedRowData?.description || ""}
            onChange={(e) => handleInputChange("description", e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </Paper>
  );
}
