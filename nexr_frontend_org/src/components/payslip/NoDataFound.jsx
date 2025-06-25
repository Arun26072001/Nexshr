export default function NoDataFound({ message, height }) {
  return (
    <div className="notFoundText" style={{ height: height ? height : "100%" }} >{message}</div>
  )
}
