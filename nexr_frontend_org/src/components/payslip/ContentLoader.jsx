import { Skeleton } from '@mui/material'
import React from 'react'

export default function ContentLoader() {
    return (
        <div style={{ width: "90%" }}>
            {
                [].map((_, index) => {
                    return <Skeleton key={index} varient="wave" />
                })
            }
        </div>
    )
}
