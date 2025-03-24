import { Skeleton } from '@mui/material'
import React from 'react'

export default function ContentLoader() {
    return (
        <div style={{width:"90%"}}>
            <Skeleton varient="wave" />
            <Skeleton varient="wave" />
            <Skeleton varient="wave" />
        </div>
    )
}
