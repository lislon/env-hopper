import { useEhContext } from '../context/EhContext';
import { JumpMiniButton } from './JumpButton/JumpMiniButton';

export function RecentJumps() {
  const {
    recentJumps,
    getEnvById,
    getAppById,
    getSubstitutionValueById,
    setApp,
    setEnv,
    setSubstitution,
  } = useEhContext();

  return (
    <div className={'prose'}>
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
            {recentJumps.slice(0, 10).map((jump) => (
              <tr
                key={`${jump.app}-${jump.env}-${jump.substitution || ''}`}
                className="hover"
              >
                <td
                  className="link no-underline hover:underline"
                  onClick={() => {
                    setEnv(getEnvById(jump.env));
                  }}
                >
                  {jump.env}
                </td>
                <td
                  className="link no-underline hover:underline"
                  onClick={() => {
                    setApp(getAppById(jump.app));
                  }}
                >
                  {jump.app}
                </td>
                <td
                  // className="px-2 py-2 cursor-pointer hover:underline"
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
  );
}
