import { Skeleton } from '@mui/material';

export default function ContentLoader() {
    return (
        <div style={{ width: "90%" }}>
            {
                [...Array(3)].map((_, index) => {
                    return <Skeleton key={index} varient="wave" />
                })
            }
        </div>
    )
}
