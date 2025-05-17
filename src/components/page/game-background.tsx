type Props = {
  imgPath: string
}

export const GameBackground: React.FC<Props> = ({ imgPath }) => {
  return (
    <img
      alt="Artwork for current game version"
      className="absolute inset-0 size-full object-cover object-center"
      src={imgPath}
    />
  )
}
