import React, { useState } from 'react';
import { Input, Select, Tabs } from 'antd';
import { 
  SwapOutlined,
  ColumnHeightOutlined,
  DashboardOutlined,
  FieldTimeOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  FireOutlined
} from '@ant-design/icons';

const { Option } = Select;

// Conversion data
const conversions = {
  length: {
    name: 'Length',
    icon: <ColumnHeightOutlined />,
    units: {
      meter: { name: 'Meters (m)', toBase: 1 },
      kilometer: { name: 'Kilometers (km)', toBase: 1000 },
      centimeter: { name: 'Centimeters (cm)', toBase: 0.01 },
      millimeter: { name: 'Millimeters (mm)', toBase: 0.001 },
      mile: { name: 'Miles (mi)', toBase: 1609.344 },
      yard: { name: 'Yards (yd)', toBase: 0.9144 },
      foot: { name: 'Feet (ft)', toBase: 0.3048 },
      inch: { name: 'Inches (in)', toBase: 0.0254 },
      nauticalMile: { name: 'Nautical Miles', toBase: 1852 },
    }
  },
  weight: {
    name: 'Weight',
    icon: <DatabaseOutlined />,
    units: {
      kilogram: { name: 'Kilograms (kg)', toBase: 1 },
      gram: { name: 'Grams (g)', toBase: 0.001 },
      milligram: { name: 'Milligrams (mg)', toBase: 0.000001 },
      pound: { name: 'Pounds (lb)', toBase: 0.453592 },
      ounce: { name: 'Ounces (oz)', toBase: 0.0283495 },
      ton: { name: 'Metric Tons', toBase: 1000 },
      stone: { name: 'Stones (st)', toBase: 6.35029 },
    }
  },
  temperature: {
    name: 'Temperature',
    icon: <FireOutlined />,
    units: {
      celsius: { name: 'Celsius (°C)' },
      fahrenheit: { name: 'Fahrenheit (°F)' },
      kelvin: { name: 'Kelvin (K)' },
    },
    customConvert: (value, from, to) => {
      let celsius;
      // Convert to Celsius first
      switch (from) {
        case 'celsius': celsius = value; break;
        case 'fahrenheit': celsius = (value - 32) * 5/9; break;
        case 'kelvin': celsius = value - 273.15; break;
        default: celsius = value;
      }
      // Convert from Celsius to target
      switch (to) {
        case 'celsius': return celsius;
        case 'fahrenheit': return (celsius * 9/5) + 32;
        case 'kelvin': return celsius + 273.15;
        default: return celsius;
      }
    }
  },
  speed: {
    name: 'Speed',
    icon: <DashboardOutlined />,
    units: {
      mps: { name: 'Meters/second (m/s)', toBase: 1 },
      kmh: { name: 'Kilometers/hour (km/h)', toBase: 0.277778 },
      mph: { name: 'Miles/hour (mph)', toBase: 0.44704 },
      knot: { name: 'Knots (kn)', toBase: 0.514444 },
      fps: { name: 'Feet/second (ft/s)', toBase: 0.3048 },
    }
  },
  time: {
    name: 'Time',
    icon: <FieldTimeOutlined />,
    units: {
      second: { name: 'Seconds (s)', toBase: 1 },
      minute: { name: 'Minutes (min)', toBase: 60 },
      hour: { name: 'Hours (hr)', toBase: 3600 },
      day: { name: 'Days', toBase: 86400 },
      week: { name: 'Weeks', toBase: 604800 },
      month: { name: 'Months (avg)', toBase: 2629746 },
      year: { name: 'Years', toBase: 31556952 },
    }
  },
  data: {
    name: 'Digital Storage',
    icon: <ThunderboltOutlined />,
    units: {
      byte: { name: 'Bytes (B)', toBase: 1 },
      kilobyte: { name: 'Kilobytes (KB)', toBase: 1024 },
      megabyte: { name: 'Megabytes (MB)', toBase: 1048576 },
      gigabyte: { name: 'Gigabytes (GB)', toBase: 1073741824 },
      terabyte: { name: 'Terabytes (TB)', toBase: 1099511627776 },
      bit: { name: 'Bits', toBase: 0.125 },
    }
  },
  area: {
    name: 'Area',
    icon: <SwapOutlined />,
    units: {
      sqMeter: { name: 'Square Meters (m²)', toBase: 1 },
      sqKilometer: { name: 'Square Kilometers (km²)', toBase: 1000000 },
      sqFoot: { name: 'Square Feet (ft²)', toBase: 0.092903 },
      sqYard: { name: 'Square Yards (yd²)', toBase: 0.836127 },
      sqMile: { name: 'Square Miles (mi²)', toBase: 2589988 },
      acre: { name: 'Acres', toBase: 4046.86 },
      hectare: { name: 'Hectares (ha)', toBase: 10000 },
    }
  },
  volume: {
    name: 'Volume',
    icon: <DatabaseOutlined />,
    units: {
      liter: { name: 'Liters (L)', toBase: 1 },
      milliliter: { name: 'Milliliters (mL)', toBase: 0.001 },
      cubicMeter: { name: 'Cubic Meters (m³)', toBase: 1000 },
      gallon: { name: 'Gallons (US)', toBase: 3.78541 },
      quart: { name: 'Quarts (US)', toBase: 0.946353 },
      pint: { name: 'Pints (US)', toBase: 0.473176 },
      cup: { name: 'Cups (US)', toBase: 0.236588 },
      fluidOunce: { name: 'Fluid Ounces (US)', toBase: 0.0295735 },
    }
  }
};

const ConverterTab = ({ type, data }) => {
  const [fromValue, setFromValue] = useState('');
  const [fromUnit, setFromUnit] = useState(Object.keys(data.units)[0]);
  const [toUnit, setToUnit] = useState(Object.keys(data.units)[1]);

  const convert = (value, from, to) => {
    if (!value || isNaN(value)) return '';
    const num = parseFloat(value);
    
    if (data.customConvert) {
      return data.customConvert(num, from, to).toFixed(6).replace(/\.?0+$/, '');
    }
    
    const baseValue = num * data.units[from].toBase;
    const result = baseValue / data.units[to].toBase;
    return result.toFixed(6).replace(/\.?0+$/, '');
  };

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const result = convert(fromValue, fromUnit, toUnit);

  return (
    <div style={{ padding: '20px 0' }}>
      {/* From Section */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
          FROM
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            type="number"
            value={fromValue}
            onChange={(e) => setFromValue(e.target.value)}
            placeholder="Enter value"
            style={{ flex: 1, minWidth: '220px', fontSize: '24px', height: '50px' }}
          />
          <Select
            value={fromUnit}
            onChange={setFromUnit}
            style={{ width: 'min(240px, 100%)' }}
            size="large"
          >
            {Object.entries(data.units).map(([key, unit]) => (
              <Option key={key} value={key}>{unit.name}</Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Swap Button */}
      <div style={{ textAlign: 'center', margin: '-8px 0' }}>
        <button
          onClick={swapUnits}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
            transform: 'rotate(90deg)',
            transition: 'transform 0.3s ease'
          }}
        >
          <SwapOutlined />
        </button>
      </div>

      {/* To Section */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderRadius: '16px',
        padding: '20px',
        marginTop: '16px',
        color: 'white'
      }}>
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px', fontWeight: '500' }}>
          TO
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1,
            fontSize: '32px',
            fontWeight: '300',
            minHeight: '50px',
            display: 'flex',
            alignItems: 'center'
          }}>
            {result || '0'}
          </div>
          <Select
            value={toUnit}
            onChange={setToUnit}
            style={{ width: 'min(240px, 100%)' }}
            size="large"
          >
            {Object.entries(data.units).map(([key, unit]) => (
              <Option key={key} value={key}>{unit.name}</Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Quick Info */}
      {fromValue && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: '#f0fdf4',
          borderRadius: '12px',
          borderLeft: '4px solid #22c55e'
        }}>
          <strong>{fromValue} {data.units[fromUnit].name}</strong> = <strong>{result} {data.units[toUnit].name}</strong>
        </div>
      )}
    </div>
  );
};

const Converter = () => {
  const tabItems = Object.entries(conversions).map(([key, data]) => ({
    key,
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {data.icon}
        {data.name}
      </span>
    ),
    children: <ConverterTab type={key} data={data} />
  }));

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔄</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '600' }}>
          Unit Converter
        </h2>
        <p style={{ margin: 0, color: '#6b7280' }}>
          Convert between different units of measurement
        </p>
      </div>

      {/* Converter Tabs */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
      }}>
        <Tabs
          items={tabItems}
          tabPosition="top"
          size="small"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Quick Reference */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
      }}>
        <h4 style={{ margin: '0 0 12px', fontWeight: '600' }}>💡 Quick Reference</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          fontSize: '13px',
          color: '#6b7280'
        }}>
          <div>• 1 inch = 2.54 cm</div>
          <div>• 1 mile = 1.609 km</div>
          <div>• 1 pound = 0.454 kg</div>
          <div>• 1 gallon = 3.785 L</div>
          <div>• °F = (°C × 9/5) + 32</div>
          <div>• 1 foot = 30.48 cm</div>
        </div>
      </div>
    </div>
  );
};

export default Converter;
