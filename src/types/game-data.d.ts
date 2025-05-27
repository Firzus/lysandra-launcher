type GlobalInfosProps = {
  id: number
  name: string
  owner: string
  repositoryName: string
  repositoryUrl: `https://github.com/${owner}/${repositoryName}`
  gameExecutable: string // Nom de l'exécutable principal du jeu
}

type CarouselEventsProps = {
  type: 'infos' | 'évènements' | 'mise à jour'
  title: string
  date: Date
  image: string
  link: string
}

type PatchInfosProps = {
  version: string
  label: string
  description: string
}

type SocialLinkProps = {
  label: string
  icon: React.ElementType
  url: string
}

export { GlobalInfosProps, CarouselEventsProps, PatchInfosProps, SocialLinkProps }
