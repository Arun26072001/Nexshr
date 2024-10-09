import React, { useState } from 'react';
import { Uploader, Message, Loader, useToaster } from 'rsuite';
import AvatarIcon from '@rsuite/icons/legacy/Avatar';
import "./payslip/layout/navbar.css";

function previewFile(file, callback) {
    const reader = new FileReader();
    reader.onloadend = () => {
        callback(reader.result);
    };
    reader.readAsDataURL(file);
}

export default function ProfileImgUploader({ userProfile, onUpdateProfileImage }) {
    const toaster = useToaster();
    const [uploading, setUploading] = useState(false);
    const [fileInfo, setFileInfo] = useState(userProfile?.image || null);

    return (
        <Uploader
            autoUpload={false}
            fileListVisible={false}
            listType="picture"
            action="/api/user/profile/upload"  // Adjust this to the actual API endpoint
            onChange={fileList => {
                const file = fileList[fileList.length - 1];
                setUploading(true);
                previewFile(file.blobFile, value => {
                    setFileInfo(value);
                    setUploading(false);
                });
            }}
            onUpload={() => {
                // Trigger the upload to update the user's profile image
                if (fileInfo) {
                    onUpdateProfileImage(fileInfo);  // Callback to update profile
                }
            }}
            onError={() => {
                setUploading(false);
                toaster.push(<Message type="error">Upload failed</Message>, { placement: 'topEnd' });
            }}>
            <button
                title='upload img'
                style={{
                    width: '35px',
                    height: '35px',
                    border: 'none',
                    padding: '0px',
                    margin: '0px'
                }}
            >
                {uploading ? (
                    <Loader backdrop center />
                ) : fileInfo ? (
                    <img src={fileInfo} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <AvatarIcon style={{ fontSize: 80 }} />
                )}
            </button>
        </Uploader>
    );
}
