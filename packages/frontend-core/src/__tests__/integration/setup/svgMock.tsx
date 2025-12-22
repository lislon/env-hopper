// Mock SVG component for testing

const SvgMock = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props}>
    <title>Mock SVG</title>
  </svg>
)

export default SvgMock
export const ReactComponent = SvgMock
