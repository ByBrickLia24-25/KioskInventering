import { handleVibrate } from './HandleVibrateFunction';
import { KeypadKeys } from './Keypad';



export interface IKeypadKeyProps
{
    keySize?: number;
    keypadKey: KeypadKeys;
    onKeyPressed: (keyPressed: KeypadKeys) => void;
}

  const handleClick = (event: React.MouseEvent<HTMLDivElement>, props: IKeypadKeyProps) => {
    props.onKeyPressed(props.keypadKey);
    console.log("Button clicked!");
    handleVibrate();
  };

export const KeypadKey = (props:IKeypadKeyProps): JSX.Element => (
    <div
        className="w-16 h-16 items-center shadow border rounded-full cursor-pointer flex justify-center m-1 p-1 "
        data-role="button"
        onClick={(event) => handleClick(event, props)}  
        tabIndex={0}
    >
        {props.keypadKey.toString()}
    </div>
);