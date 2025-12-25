import { Link } from "~/components/ui/link";
import { useResourceJumpContext } from "~/modules/resourceJump/context/ResourceJumpContext";
import { getEhToOptions } from "~/util/route-utils";

export function HomePage() {
  const { flagshipJumpResources} = useResourceJumpContext();
  return (
    <div className="flex flex-col gap-4 py-12">
      <div>
        <div className="grid grid-cols-1">
          {flagshipJumpResources.length === 0
            ? 'No applications found.'
            : ''}
          {flagshipJumpResources.map((res) => (
            <div
              key={res.slug}
              className="border border-border rounded-md p-4 m-2"
            >
              <div className="font-medium">
                <Link {...getEhToOptions({
                  appId: res.slug,
                })}>
                {res.displayName}
                </Link>
                </div>
              <div className="text-sm text-muted-foreground">
                {res.resourceJumps.length} Resource Jumps
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
