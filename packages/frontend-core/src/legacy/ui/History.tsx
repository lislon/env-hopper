import cn from 'classnames'
import { JumpMiniButton } from './JumpButton/JumpMiniButton'
import { useMainAppFormContext } from '../context/MainFormContextProvider'

export interface HistoryProps {
  className?: string
}

/**
 * The recent-jumps table under the form. One row per remembered jump, newest
 * first, capped at 50 of the `MAX_HISTORY_JUMPS` kept in storage. Clicking a
 * cell preselects that env / app / context in the form; the last column jumps
 * straight there.
 */
export function History({ className }: HistoryProps) {
  const {
    recentJumps,
    getEnvById,
    getAppById,
    getSubstitutionValueById,
    setApp,
    setEnv,
    setSubstitution,
  } = useMainAppFormContext()

  return (
    <div className={cn('flex justify-center', className)}>
      <div className={'flex flex-col prose'}>
        <h4>History</h4>
        <div>
          <table className="table">
            <thead>
              <tr className="text-left">
                <th scope="col" className="px-2">
                  Env
                </th>
                <th scope="col" className="px-2">
                  App
                </th>
                <th scope="col" className="px-2">
                  Context
                </th>
                <th scope="col" className="px-2" title={'Actions'}></th>
              </tr>
            </thead>
            <tbody>
              {recentJumps.slice(0, 50).map((jump) => (
                <tr
                  key={`${jump.app}-${jump.env}-${jump.substitution || ''}`}
                  className="hover"
                >
                  <td
                    className="link no-underline hover:underline"
                    onClick={() => {
                      setEnv(getEnvById(jump.env))
                    }}
                  >
                    {jump.env}
                  </td>
                  <td
                    className="link no-underline hover:underline"
                    onClick={() => {
                      setApp(getAppById(jump.app))
                    }}
                  >
                    {jump.app}
                  </td>
                  <td
                    onClick={() =>
                      setSubstitution(
                        getSubstitutionValueById(
                          jump.env,
                          jump.app,
                          jump.substitution,
                        ),
                      )
                    }
                  >
                    {jump.substitution}
                  </td>
                  <td className="px-2 py-2">
                    <JumpMiniButton
                      env={getEnvById(jump.env)}
                      app={getAppById(jump.app)}
                      substitution={getSubstitutionValueById(
                        jump.env,
                        jump.app,
                        jump.substitution,
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
