import React from 'react';
import { BaseDialogProps, BaseModal } from '../../Dialog/BaseModal';

export type K8SClientStyle = 'k9s' | 'kubectl';

export interface SettingsModalProps extends BaseDialogProps {
  k8sStyle: K8SClientStyle;
  onChangeK8sStyle: (style: K8SClientStyle) => void;
  preview: string;
}

export function SettingsModal({
  preview,
  k8sStyle,
  onChangeK8sStyle,
  ...props
}: SettingsModalProps) {
  const options: K8SClientStyle[] = ['kubectl', 'k9s'];
  return (
    <BaseModal {...props} className={'prose'}>
      <h3>Change kubernetes client style</h3>

      {options.map((option) => (
        <div className="form-control w-32">
          <label className="label cursor-pointer">
            <span className="label-text">{option}</span>
            <input
              type="radio"
              name="radio-10"
              className="radio"
              checked={k8sStyle === option}
              onChange={() => onChangeK8sStyle(option)}
            />
          </label>
        </div>
      ))}
      {preview && (
        <div>
          Preview
          <pre>
            <code className={'text-xs'}>{preview}</code>
          </pre>
        </div>
      )}
    </BaseModal>
  );
}
