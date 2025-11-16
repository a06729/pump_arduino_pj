type motor_type={
  //모터 첫번쨰 두번쨰 인지 확인하는 값
  id:number,
  //모터 ml 값 정보
  motor_value:string
}

enum motor_fun_enum{
    //첫번째 모터 INDEX 값 enum으로 생성
    Motor_First_ID = 1,
    //두번째 모터 INDEX 값 enum으로 생성
    Motor_Second_ID =2
}

export {motor_type,motor_fun_enum}