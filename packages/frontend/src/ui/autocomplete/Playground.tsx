export function Playground() {
  return <ul className="menu w-full max-w-md bg-base-100 rounded-box shadow text-sm">
    <!-- App: LIMS -->
    <li>
      <a className="pl-2 hover:bg-base-200 flex justify-between items-center">
        LIMS
        <span className="badge badge-xs bg-red-500 border-0 ml-2"></span>
      </a>
    </li>

    <!-- Group: prod-lims -->
    <li>
      <a className="pl-6 hover:bg-base-200">
        prod-lims
      </a>
    </li>

    <!-- Pages under prod-lims -->
    <li><a className="pl-10 hover:bg-base-200">Script Console Prod-Lims</a></li>
    <li><a className="pl-10 hover:bg-base-200">Script Console Prod-Lims (Predefined)</a></li>

    <!-- Group: extranet -->
    <li>
      <a className="pl-6 hover:bg-base-200">
        Extranet
      </a>
    </li>
    <li><a className="pl-10 hover:bg-base-200">Console</a></li>
    <li><a className="pl-10 hover:bg-base-200">Referral case #</a></li>
    <li><a className="pl-10 hover:bg-base-200">Edit organization/clinic #</a></li>

    <!-- Group: lims-api (no group label shown) -->
    <li><a className="pl-6 hover:bg-base-200">Console</a></li>

    <!-- App: Sample Review App 1.0 -->
    <li>
      <a className="pl-2 hover:bg-base-200 flex justify-between items-center">
        Sample Review App 1.0
        <span className="badge badge-xs bg-red-500 border-0 ml-2"></span>
      </a>
    </li>

    <!-- Group: not-used (missing group case: omit group label) -->
    <li><a className="pl-6 hover:bg-base-200">Home</a></li>
    <li><a className="pl-6 hover:bg-base-200">Case #</a></li>
  </ul>
}
