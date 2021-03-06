#include <math.h>
#include <Wire.h>
#include <Servo.h>
#include <PID_v1.h>
#include <XBee.h>
#include <SoftwareSerial.h>
SoftwareSerial XBee(2,3); 

//XbeeApiStream xbeeStream = XbeeApiStream();


#define LIDAR_ADDRESS 0x62
#define LIDAR_CONTROL_ADDRESS 0x00
#define LIDAR_CONTROL_VALUE 0x04
#define LIDAR_RANGE_ADDRESS 0x8f

// Delay when starting up
int pauseStart = 1000;

/*
Pins

Steering  - 8
Speed - 9

LidarOut1 - 2
LidarIn1 - 3

LidarOut2 - 6
LidarIn2 - 5

Infared - 1


Lidar enable is connected to pins 12 and 13
*/

// XBee stuff
bool systemState = true;

// Time data
long currentTime;
long timeStamp;


// Servo for turning the car and servo for reference.
Servo steering_wheels;
Servo escServo;

const float pi = 3.14159;

// PID requisites
double input_angle;
double output_angle;
double reference_angle;

double distanceIn;
double distanceOut;
double reference_distance;

double speed_in;
double speed_out;
double reference_speed;

// angle control
double aKp = 1;
double aKi = 0;
double aKd = 0;

// distance control
double dKp = 1;
double dKi = 0;
double dKd = 0;

// speed control
double sKp = 40;
double sKi = 0;
double sKd = 0;


double positional_error;


// We'll need 3 PID's. Angle from wall, distance from wall, and speed

PID angle_PID(&input_angle, &output_angle, &reference_angle, aKp, aKi, aKd, DIRECT); // LIDAR
PID control_PID(&distanceIn, &distanceOut, &reference_distance, dKp, dKi, dKd, DIRECT); // Sonar
PID speed_PID(&speed_in, &speed_out, &reference_speed, sKp, sKi, sKd, DIRECT);

// Wheel encoding
const int wheelSpeedPin = 5;
volatile int encoderCount = 0;
double rotationalSpeed;
#define ENCODER_SCALING = 833.33


// Sonar info
int sonarRange = 50;
long analogReading;
long centimeterDistance;


// *********** Lidar related global variables *******************
int lidarCase = 0; // Off, On, Triggered, GetData
int lidarOn = 0;
int caseProgression = 0;

int lidarPower[] = {12, 13};

int wallDistance[2];


//double lidar_offset = 20;




// Setup Loop
void setup(){

  // Controls steering
  steering_wheels.attach(8);

  // Controls speed
  escServo.attach(9);

  // Calibrate speed control
  calibrateESC();

  // LIDAR pins
  //Wire.begin();
  pinMode(3, OUTPUT);
  pinMode(4, OUTPUT);


  angle_PID.SetMode(AUTOMATIC);
  control_PID.SetMode(AUTOMATIC);
  speed_PID.SetMode(AUTOMATIC);

  angle_PID.SetOutputLimits(-45,45);
  control_PID.SetOutputLimits(-45,45);
  speed_PID.SetOutputLimits(-60,60);

  XBee.begin(9600);
  Wire.begin();
  delay(100);

  pinMode(2, INPUT);

}


void preRunVars() {
  pinMode(12, OUTPUT);
  pinMode(13, OUTPUT);

  for(int i = 0; i < 2; i++){
    for(int k = 0; k < 2; k++) {
      digitalWrite(lidarPower[k], LOW);
      digitalWrite(lidarPower[i], HIGH);

      while(1) {
        Wire.beginTransmission(LIDAR_ADDRESS);
        Wire.write(0x01);
        Wire.write(0xFF);
        if (Wire.endTransmission() == 0) {
          break;
        }
      }
    }
  }
}



// Main program loop
void loop() {

  // if you can't connect to the XBee, then don't do anything.
  if(XBee.available() && XBee.read() == 0x00){
    systemState = !systemState;
    if(systemState){
      escServo.write(90);
    }
  }

  if(!systemState){
    currentTime = millis();
    getLidarInfo();

   

    input_angle = getAngle(wallDistance[0], wallDistance[1]);
    distanceIn = getWallDistance(wallDistance[0], wallDistance[1], input_angle);

    // Go to radians
    input_angle = angleChange(input_angle);

    angle_PID.Compute();
    control_PID.Compute();
    speed_PID.Compute();

    steering_wheels.write(90 - speed_out);
    escServo.write(90 + output_angle - distanceOut);


  }
} // end of main loop

double angleChange(double oldAng){
  double angle = oldAng * 180 / pi;
  return angle;
}


int count;
void calibrateSonar() {
  for(int i = 0; i < 60; i++)
  {
    analogReading = analogRead(4) / 8;

  }
}


// function to get lidar info/distance given by lidars.
void getLidarInfo(){

  // enabledLidar = lidarOn

  switch(lidarCase){
    // Case when lidar is powered off. Get out of this case and move to a case where
    // we can get data from the lidar and pass it to the control functions
    case 0:
        for(int i = 0; i < 2; i++){
          digitalWrite(lidarPower[i], LOW);
          digitalWrite(lidarPower[lidarOn], HIGH);
          lidarCase = 1;
          caseProgression = 0;
        }
        break;

    // Lidar is on and enabled
    case 1:
        Wire.beginTransmission(LIDAR_ADDRESS);
        Wire.write(LIDAR_CONTROL_ADDRESS);
        Wire.write(LIDAR_CONTROL_VALUE);

        if(Wire.endTransmission() == 0){
          lidarCase = 2;
        } else {
          caseProgression = caseProgression + 1;
        }
        break;

    // Lidar is triggered
    case 2:
        Wire.beginTransmission(LIDAR_ADDRESS);
        Wire.write(LIDAR_RANGE_ADDRESS);

        if(Wire.endTransmission() == 0){
          lidarCase = 3;
        } else {
          caseProgression = caseProgression + 1;
        }
        break;

    case 3:
        if(Wire.requestFrom(LIDAR_ADDRESS, 2) >= 2){
          unsigned int temp = Wire.read() << 8 | Wire.read();
          if (temp < 500 && temp > 10){
            wallDistance[lidarOn] = 0.2 * wallDistance[lidarOn] + 0.8 * temp;
            lidarOn = 1 - lidarOn;
            lidarCase = 0;
          }
        } else {
          caseProgression = caseProgression + 1;
        }
        break;

  } // end of case machine

  // Make sure we can actually get out of the case machine
  // and return control to the steering, front infared, etc.
  if(caseProgression > 20){
    lidarCase = 0;
    lidarOn = 1 - lidarOn;
    caseProgression = 0;
  }
}


// Method to get the angle between the car and the wall
double getAngle(double offset1, double offset2){
  double angle;
  angle = atan((offset1 - offset2) / 20);
  return angle;
}


// Method to get the distance between the wall and the car
double getWallDistance(double offset1, double offset2, double wallAngle){
  return ((offset1 + offset2) * cos(wallAngle)) / 2;
}


void pid_steering(void) {
  positional_error = distanceIn - reference_distance;
  control_PID.SetTunings(dKp, dKi, dKd);
  control_PID.Compute();
  steering_wheels.write(1);
}

void calibrateESC(){
    escServo.write(180); // full backwards
    delay(pauseStart);
    escServo.write(0); // full forwards
    delay(pauseStart);
    escServo.write(90); // neutral
    delay(pauseStart);
    escServo.write(90); // reset the ESC to neutral (non-moving) value
}
