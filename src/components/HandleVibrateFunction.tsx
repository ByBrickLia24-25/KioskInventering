export const handleVibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(100); // Vibrerar i 200 ms
    } else {
      console.log("Vibration API stöds inte av denna enhet");
    }
  };